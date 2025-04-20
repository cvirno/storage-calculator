export const auth0Config = {
  domain: "dev-0afpcj54klh2vplm.us.auth0.com",
  clientId: "I14u5aeRr4kvPlcLHxhe5mrADSdT8J55",
  authorizationParams: {
    redirect_uri: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5173'
      : 'https://prismatic-choux-897487.netlify.app'
  }
};

// IMPORTANTE: Você precisa adicionar as seguintes URLs no painel do Auth0:
// - http://localhost:5173
// - http://localhost:5174
// - http://localhost:5175
// - http://localhost:5176
// - https://prismatic-choux-897487.netlify.app 