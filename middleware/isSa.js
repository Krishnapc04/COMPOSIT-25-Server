const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables

const isSa = (req, res, next) => {
    // console.log(req.cookies)
    // console.log(req.cookies.token)
    // const token = req.cookies.token;
    // const token = req.header('auth-token');
    const { token} = req.body;

    // console.log("token found", token)
    if (!token) return res.status(401).send({ message: 'Unauthorized - Token not Provided' });

    try {
        // console.log("try runned")
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('decoded token', token)
        const logedInUserId = decoded.id;
        const role = decoded.role;

        const requestedUserId = req.body.SaId;


        // console.log(role, logedInUserId, requestedUserId, decoded)

        if (logedInUserId !== requestedUserId) {
            return res.status(401).send({ message: 'Unauthorized - Invalid Token' });
        }

    if (role !== 'Student Ambassador') {
      return res.status(403).json({ message: 'Access denied. You are not a Student Ambassador.' });
    }


        req.userId = decoded;
        // console.log("before next")
        next();

        // console.log("after next", req.user)
    } catch (error) {
        console.error('Authorization Error:', error.message);
        res.status(401).json({ error: 'Invalid or expired token' });    }
}

module.exports = isSa;