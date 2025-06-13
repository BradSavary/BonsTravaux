import { NavBar } from "../components/NavBar/NavBar";
import { Outlet } from "react-router-dom";

export function Root() {
    return (
            <NavBar>
                <Outlet />
            </NavBar>
    );
}