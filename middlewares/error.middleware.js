const errorMiddleware = (error,req,res,next)=>{
    req.statusCode = req.statusCode || 500;
    req.message = req.message || "Somethin went wrong";

    res.status(req.statusCode).json({
        success:false,
        message:req.message,
        stack:error.stack
    });
    next();
}
module.exports = errorMiddleware