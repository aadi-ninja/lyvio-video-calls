import { Loader2Icon } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";

const PageLoader = () => {
    const {theme} = useThemeStore();
    return (
        <div className="min-h-screen flex items-center justify-center" data-theme={theme}>
        <Loader2Icon className="size-10 animate-spin text-primary" />
        </div>
    );
};

export default PageLoader;
