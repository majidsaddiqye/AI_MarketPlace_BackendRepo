const jwt = require("jsonwebtoken");


// Creates a role-based authentication middleware using JWT
function createAuthMiddleware(roles = ["user"]) {
  return function authMiddleware(req, res, next) {
     // Extracts JWT token from cookies or Authorization header
    const token =
      req.cookies?.token || req.headers?.authorization?.split(" ")[1];

       // Blocks request if no token is provided
      if(!token){
        return res.status(401).json({
            message:"No Token Provided"
        })
      }

      try {
         // Verifies token and decodes user data
        const decoded = jwt.verify(token,process.env.JWT_SECRET)

         // Checks if user role is allowed to access the route
        if (!roles.includes(decoded.role)){
            return res.status(403).json({
                message:"Forbidden: Insufficent permission"
            })
        }

         // Attaches authenticated user data to request object
        req.user = decoded
        next()
      } catch (error) {

        // Handles invalid or expired token
        return res.status(401).json({
            message:"Unauthorized Invalid Token"
        })
      }
  };
}


module.exports = {createAuthMiddleware}
