// client/src/main.tsx
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import 'date-fns/locale/vi';

// Thêm các dòng console.log này vào đây
console.log("-----------------------------------------");
console.log("Client-side Environment Check:");
console.log("window.isElectron:", window.isElectron); // Kiểm tra biến này

// Để kiểm tra giá trị API_BASE_URL từ queryClient.ts, chúng ta cần import nó
// Lưu ý: Import trong main.tsx sẽ khởi tạo queryClient
import { apiRequest } from './lib/queryClient';
const API_BASE_URL_FROM_QUERY_CLIENT = (window as any).API_BASE_URL; // Truy cập trực tiếp nếu nó được set
// Hoặc inspect hàm apiRequest để thấy URL
// if (typeof apiRequest === 'function') {
//     console.log("apiRequest function string:", apiRequest.toString());
// }

console.log("API_BASE_URL (as set in queryClient.ts):", API_BASE_URL_FROM_QUERY_CLIENT); // Đây là cách tốt nhất để kiểm tra API_BASE_URL
console.log("-----------------------------------------");


createRoot(document.getElementById("root")!).render(<App />);