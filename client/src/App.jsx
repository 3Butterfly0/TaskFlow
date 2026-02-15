import { Toaster } from 'react-hot-toast';
import { SocketProvider } from "./context/SocketContext";
import AppRouter from "./routes/AppRouter";

const App = () => {
  return (
    <SocketProvider>
      <AppRouter />
      <Toaster position="top-right" />
    </SocketProvider>
  );
};

export default App;
