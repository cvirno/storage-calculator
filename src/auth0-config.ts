export const auth0Config = {
  domain: "dev-0afpcj54klh2vplm.us.auth0.com",
  clientId: "I14u5aeRr4kvPlcLHxhe5mrADSdT8J55",
  authorizationParams: {
    redirect_uri: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5173'
      : 'https://prismatic-choux-897487.netlify.app'
  }
}; 