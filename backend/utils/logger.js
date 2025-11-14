// Utilidad para logging detallado del auto-reply
export function logAutoReply(action, data) {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] 🤖 AUTO-REPLY ${action.toUpperCase()}`);
  console.log('   Data:', JSON.stringify(data, null, 2));
  console.log('');
}

export function logWebhookEvent(eventType, data) {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] 📥 WEBHOOK ${eventType.toUpperCase()}`);
  if (data) {
    console.log('   Summary:', {
      user: data.user || data.from?.username || 'unknown',
      message: data.message || data.text?.substring(0, 50) || 'N/A',
      commentId: data.id || data.comment_id || 'N/A'
    });
  }
  console.log('');
}

