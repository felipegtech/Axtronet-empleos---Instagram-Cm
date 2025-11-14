import JobOffer from '../models/JobOffer.js';
import Survey from '../models/Survey.js';
import instagramService from './instagramService.js';
import Interaction from '../models/Interaction.js';
import Candidate from '../models/Candidate.js';

class PublishingService {
  // Publicar oferta laboral
  async publishJobOffer(jobOfferId, type = 'post') {
    try {
      const jobOffer = await JobOffer.findById(jobOfferId);
      if (!jobOffer) {
        throw new Error('Job offer not found');
      }

      const hashtagsString = jobOffer.hashtags.map(tag => `#${tag}`).join(' ');
      const caption = `${jobOffer.title}\n\n${jobOffer.description}\n\n${hashtagsString}`;

      let result;
      const igBusinessAccountId = await instagramService.getInstagramBusinessAccountId();

      if (type === 'story') {
        result = await instagramService.publishStory(jobOffer.imageUrl);
        jobOffer.instagramPostId = result.storyId;
      } else if (jobOffer.mediaType === 'carousel' && jobOffer.carouselImages && jobOffer.carouselImages.length > 1) {
        // Publicar carrusel
        const imagePaths = jobOffer.carouselImages.map(img => {
          // Preferir path absoluto, si no usar url
          if (img.path) return img.path;
          if (img.url) return img.url;
          return null;
        }).filter(Boolean);
        
        if (imagePaths.length < 2) {
          throw new Error('El carrusel debe tener al menos 2 imágenes');
        }
        
        result = await instagramService.publishCarousel(
          imagePaths,
          caption,
          jobOffer.hashtags,
          igBusinessAccountId
        );
        jobOffer.instagramPostId = result.postId;
      } else if (jobOffer.mediaType === 'reel' || jobOffer.mediaType === 'video') {
        // Publicar reel/video
        const videoPath = jobOffer.videoPath || jobOffer.videoUrl;
        if (!videoPath) {
          throw new Error('Se requiere un video para publicar un reel');
        }
        
        result = await instagramService.publishReel(
          videoPath,
          caption,
          jobOffer.hashtags,
          jobOffer.coverImageUrl,
          igBusinessAccountId
        );
        jobOffer.instagramPostId = result.postId;
      } else {
        // Publicar imagen simple
        const imagePath = jobOffer.imagePath || jobOffer.imageUrl;
        if (!imagePath) {
          throw new Error('Se requiere una imagen para publicar');
        }
        
        result = await instagramService.publishPost(
          imagePath,
          caption,
          jobOffer.hashtags,
          igBusinessAccountId
        );
        jobOffer.instagramPostId = result.postId;
      }

      jobOffer.published = true;
      jobOffer.publishedAt = new Date();
      jobOffer.analytics = jobOffer.analytics || {};
      
      // Obtener insights iniciales después de publicar (con delay)
      setTimeout(async () => {
        try {
          const insights = await instagramService.getPostInsights(result.postId);
          if (insights.success) {
            jobOffer.analytics.reactions = insights.insights.likes || 0;
            jobOffer.analytics.comments = insights.insights.comments || 0;
            jobOffer.analytics.reach = insights.insights.reach || 0;
            jobOffer.analytics.impressions = insights.insights.impressions || 0;
            jobOffer.analytics.saves = insights.insights.saved || 0;
            await jobOffer.save();
          }
        } catch (err) {
          console.error('Error obteniendo insights:', err.message);
        }
      }, 10000); // Esperar 10 segundos después de publicar

      await jobOffer.save();

      return {
        success: true,
        jobOffer,
        instagramResult: result
      };
    } catch (error) {
      console.error('Error publishing job offer:', error);
      throw error;
    }
  }

  // Publicar encuesta
  async publishSurvey(surveyId, type = 'post') {
    try {
      const survey = await Survey.findById(surveyId);
      if (!survey) {
        throw new Error('Survey not found');
      }

      const optionsText = survey.options.map((opt, idx) => 
        `${idx + 1}. ${opt.text}`
      ).join('\n');

      const caption = `${survey.title}\n\n${survey.question}\n\n${optionsText}`;

      let result;
      if (type === 'story') {
        result = await instagramService.publishStory(null);
        survey.instagramPostId = result.storyId;
      } else {
        result = await instagramService.publishPost(null, caption);
        survey.instagramPostId = result.postId;
      }

      survey.published = true;
      survey.publishedAt = new Date();
      await survey.save();

      return {
        success: true,
        survey,
        instagramResult: result
      };
    } catch (error) {
      console.error('Error publishing survey:', error);
      throw error;
    }
  }

  // Identificar candidatos interesados según reacciones
  async identifyInterestedCandidates(postId, jobOfferId) {
    try {
      // Buscar todas las interacciones relacionadas con este post
      const interactions = await Interaction.find({
        $or: [
          { postId },
          { 'metadata.instagramPostId': postId }
        ]
      });

      const interestedCandidates = [];

      for (const interaction of interactions) {
        // Si es reacción positiva (like, love, etc)
        if (interaction.type === 'reaction' && 
            ['like', 'love', 'wow'].includes(interaction.reactionType)) {
          
          // Buscar o crear candidato
          let candidate = await Candidate.findOne({ 
            instagramHandle: interaction.user.toLowerCase() 
          });

          if (!candidate) {
            candidate = new Candidate({
              instagramHandle: interaction.user.toLowerCase(),
              name: interaction.user,
              engagementScore: 5 // Reacción positiva = interés
            });
          } else {
            candidate.engagementScore = Math.min(100, candidate.engagementScore + 5);
          }

          // Agregar interés en esta oferta
          const existingInterest = candidate.jobOfferInterest.find(ji => {
            if (!jobOfferId) {
              return false;
            }
            return ji.jobOfferId?.toString() === jobOfferId.toString();
          });

          if (!existingInterest && jobOfferId) {
            candidate.jobOfferInterest.push({
              jobOfferId,
              interestLevel: 'high',
              interactedAt: interaction.timestamp
            });
          }

          await candidate.save();
          interestedCandidates.push(candidate);
        }

        // Si es comentario, analizar con NLP
        if (interaction.type === 'comment') {
          const nlpService = (await import('./nlpService.js')).default;
          const analysis = nlpService.analyzeInteraction(interaction);

          if (analysis.jobInterest || analysis.sentiment === 'positive') {
            let candidate = await Candidate.findOne({ 
              instagramHandle: interaction.user.toLowerCase() 
            });

            if (!candidate) {
              candidate = new Candidate({
                instagramHandle: interaction.user.toLowerCase(),
                name: interaction.user,
                engagementScore: 10, // Comentario con interés = mayor puntuación
                interestAreas: analysis.jobKeywords
              });
            } else {
              candidate.engagementScore = Math.min(100, candidate.engagementScore + 10);
            }

            // Agregar información demográfica
            if (analysis.demographic) {
              if (analysis.demographic.location) {
                candidate.metadata = {
                  ...candidate.metadata,
                  location: analysis.demographic.location
                };
              }
              if (analysis.demographic.age) {
                candidate.metadata = {
                  ...candidate.metadata,
                  age: analysis.demographic.age
                };
              }
            }

            // Agregar interés en esta oferta
            const existingInterest = candidate.jobOfferInterest.find(ji => {
              if (!jobOfferId) {
                return false;
              }
              return ji.jobOfferId?.toString() === jobOfferId.toString();
            });

            if (!existingInterest && jobOfferId) {
              candidate.jobOfferInterest.push({
                jobOfferId,
                interestLevel: analysis.jobInterest ? 'high' : 'medium',
                interactedAt: interaction.timestamp
              });
            }

            await candidate.save();
            interestedCandidates.push(candidate);
          }
        }
      }

      return {
        success: true,
        count: interestedCandidates.length,
        candidates: interestedCandidates
      };
    } catch (error) {
      console.error('Error identifying interested candidates:', error);
      throw error;
    }
  }

  // Recolectar información poblacional de interacciones
  async collectDemographicData() {
    try {
      const interactions = await Interaction.find({ type: 'comment' });
      const nlpService = (await import('./nlpService.js')).default;

      const demographics = {
        totalInteractions: interactions.length,
        locations: {},
        ageGroups: {},
        interests: {},
        topics: {}
      };

      for (const interaction of interactions) {
        const analysis = nlpService.analyzeInteraction(interaction);
        
        // Recolectar ubicaciones
        if (analysis.demographic.location) {
          const location = analysis.demographic.location;
          demographics.locations[location] = (demographics.locations[location] || 0) + 1;
        }

        // Recolectar edades
        if (analysis.demographic.age) {
          const ageGroup = this.getAgeGroup(analysis.demographic.age);
          demographics.ageGroups[ageGroup] = (demographics.ageGroups[ageGroup] || 0) + 1;
        }

        // Recolectar intereses
        analysis.demographic.interests.forEach(interest => {
          demographics.interests[interest] = (demographics.interests[interest] || 0) + 1;
        });

        // Recolectar temas
        analysis.topics.forEach(topic => {
          demographics.topics[topic] = (demographics.topics[topic] || 0) + 1;
        });
      }

      return demographics;
    } catch (error) {
      console.error('Error collecting demographic data:', error);
      throw error;
    }
  }

  getAgeGroup(age) {
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    return '55+';
  }
}

export default new PublishingService();

