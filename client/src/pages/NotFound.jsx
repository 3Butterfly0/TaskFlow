import ErrorState from "../components/ui/ErrorState";

const NotFound = () => {
  return <ErrorState statusCode={404} variant="fullPage" />;
};

export default NotFound;
