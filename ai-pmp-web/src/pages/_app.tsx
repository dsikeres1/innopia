import "../../public/pub-hyper/assets/css/vendor/jquery-jvectormap-1.2.2.css";
import "../../public/pub-hyper/assets/css/icons.min.css";
import "../../public/pub-hyper/assets/css/app.min.css";
import "../styles/globals.css";
import "../styles/react-date-range.css";
import "../styles/front.css";
import dynamic from "next/dynamic";
import { App } from "../app"; 

export default dynamic(async () => App, { ssr: false });