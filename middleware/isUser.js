const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables

const isUser = (req, res, next) => {
    // console.log(req.cookies)
    // console.log(req.cookies.token)
    // const token = req.cookies.token;
    // const token = req.header('auth-token');
    const { token} = req.body;

    console.log("token found", token)
    if (!token) return res.status(401).send({ message: 'Unauthorized - Token not Provided, not found' });

    try {
        // console.log("try runned")
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // console.log('decoded token', decoded)
        let logedInUserId = decoded.id;
        

        if (decoded.role && decoded.role === 'Student Ambassador') {
            logedInUserId = decoded.regId
        }

        const requestedUserId = req.body.userId;

        console.log(logedInUserId, requestedUserId)
        if (logedInUserId !== requestedUserId) {
            return res.status(401).send({ message: 'Unauthorized - Invalid Token id is differrent' });
        }
        

        req.userId = decoded;
        // console.log("before next")
        next();

        // console.log("after next", req.user)
    } catch (error) {
        console.error('Authorization Error:', error.message);
        res.status(401).json({ error: 'Invalid or expired token' });    }
}

module.exports = isUser;