const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const dotenv = require('dotenv')
dotenv.config();

const isLoggedIn = async function(req,res,next){

    const { token } = req.cookies;

    if(!token){
        return next(new AppError('Unauthenticated, please login',401));
    }

    const tokenDetails = await jwt.verify(token,process.env.SECRET);
    if(!tokenDetails){
        return next(new AppError("Unauthenticated, please login",401));
    }
    req.user = tokenDetails;

    next();
}

const authorizedRoles = (...roles) => (req,res,next)=>{
    const currentRoles = req.user.role;
    if(!roles.includes(currentRoles)){
        return next(
            new AppError("You do not has permission to access this route",403)
        );
    }
    next();
}

module.exports = {
    isLoggedIn,
    authorizedRoles
}