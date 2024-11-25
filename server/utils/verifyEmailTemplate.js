const verifyEmailTemplate = ({ name, url }) => {
  return `
    <p>Hello, ${name}!</p>
    <p>Thank you for registering with us. Please click the link below to verify your email address:</p>
    <a href="${url}" style="color:white; background: #071263; margin-top: 10px, padding:20px;">
      Verify Email
    </a>
  `;
};

export default verifyEmailTemplate;
