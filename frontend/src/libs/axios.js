import axios from "axios";
// used to connect frontend with backend
export const axiosInstance = axios.create({
    baseURL: "http://localhost:5001/api",
    withCredentials: true,
});