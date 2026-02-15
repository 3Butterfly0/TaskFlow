import { SocketProvider } from "./context/SocketContext";
import AppRouter from "./routes/AppRouter";

const App = () => {
  return (
    <SocketProvider>
      <AppRouter />
    </SocketProvider>
  );
};

export default App;
