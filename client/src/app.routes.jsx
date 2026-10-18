import { createBrowserRouter } from "react-router";
import Login from "./features/auth/pages/Login.jsx";    
import Register from "./features/auth/pages/Register.jsx";
import Protected from "./features/auth/components/protected.jsx";
import Home from "./features/interview/pages/Home.jsx";
import Interview from "./features/interview/pages/Interview.jsx";
import RootLayout from "./layouts/RootLayout.jsx";

export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/",
        element: <Protected><RootLayout /></Protected>,
        children: [
            {
                index: true,
                element: <Home />
            },
            {
                path: "interview/:interviewId",
                element: <Interview />
            }
        ]
    }
])

 