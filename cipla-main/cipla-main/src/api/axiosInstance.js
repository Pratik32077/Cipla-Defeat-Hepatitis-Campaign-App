import axios from "axios";
import { BASE_URL } from "../Utils/urlconfig";

const instance = axios.create({
    baseURL: BASE_URL,
});

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    console.log("TOKEN SENT:", token); // 👈 DEBUG

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default instance;