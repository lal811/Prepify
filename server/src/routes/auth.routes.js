import { Router } from 'express';
import {registerUserController, loginUserController, logoutUserController, getmeController}  from '../controllers/auth.controller.js'
import authUser from "../middlewares/auth.middleware.js"

const authRouter = Router();

/**
 * @route POST /api/auth/login
 * @desc Login user and return JWT token
 */


authRouter.post('/register', registerUserController);

/**
 * @route POST /api/auth/login
 * @description login user with emial and password
 * @access Public
 */

authRouter.post('/login', loginUserController);

/**
 * @route POST /api/auth/logout
 * @description clear token from user cookie and add the token in blacklist
 * @access Public
 */

authRouter.post("/logout",logoutUserController)

/**
 * @route POST /api/auth/get-me
 * @description get the current logged in user details
 * @access Private
 */

authRouter.get("/get-me", authUser, getmeController);
export default authRouter; 


