exports.handler = async (event, context) => { const subject = event.queryStringParameters.name || 'Świecie' 
return { statusCode: 200, body: Cześć ${subject}, pozdrawia Netlify Function!, } }
