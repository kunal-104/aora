import { createContext, useContext, useState,useEffect } from "react";
import { getCurrentUser } from "../lib/appwrite";
import { Redirect, router } from "expo-router";

const GlobalContext = createContext();
export const useGlobalContext = ()=> useContext(GlobalContext);

const GlobalProvider = ({children})=>{
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(()=>{
        getCurrentUser()
            .then((res)=> {
                // console.log('respp::::',res)
                if(res){
                    router.replace('/home')
                    // console.log('1,:::',isLoggedIn)
                    setIsLoggedIn(true);
                    // console.log('1,2:::',isLoggedIn)
                    // console.log('1,2:::::',isLoading)
                    setUser(res)
                    setIsLoading(false)
                } else {
                    // router.replace('/home') 
                    setIsLoggedIn(false);
                    setUser(null)
                }
            })
            .catch((error)=>{
                console.log(error);
            })
            .finally(()=>{
                setIsLoading(false);
            })
    },[]);

    return (
        <GlobalContext.Provider
        value={{
            isLoggedIn,
            setIsLoggedIn,
            user,
            setUser,
            isLoading
        }}
        >
            {children}
        </GlobalContext.Provider>


    )
}

export default GlobalProvider;