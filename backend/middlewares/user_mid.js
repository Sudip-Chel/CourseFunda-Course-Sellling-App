import jwt from "jsonwebtoken";

function userMiddleware(req, res, next) {

    
    const authHeader = req.headers.authorization;
    console.log("Authorization header:", authHeader);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    

    try {
        const decoded = jwt.verify(token, process.env.JWT_USER_PASSWORD);
        console.log("Decoded token:", decoded);
       req.userId = decoded.userId ; // Assuming the token contains user ID

        next();
    } catch (error) {
        console.log("Invalid token or expired token"+error);
        return res.status(401).json({ error: "Invalid token or expired " });
        
        
    }
}

export default userMiddleware;
