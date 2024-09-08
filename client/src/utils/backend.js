import axios from "axios";
import { API_URL } from "../constants";

export const backend = axios.create({
    baseURL: API_URL
  });