import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Welcome from "@/pages/welcome";
import Login from "@/pages/login";
import Home from "@/pages/home";
import PersonalChat from "@/pages/personal-chat";
import ChatManager from "@/pages/chat-manager";
import JoinMeeting from "@/pages/join-meeting";
import JoinSharedMeeting from "@/pages/join-shared-meeting";
import JoinByCode from "@/pages/join-by-code";
import NotFound from "@/pages/not-found";
import AuthWrapper from "@/components/AuthWrapper";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/login" component={Login} />
      <Route path="/home">
        <AuthWrapper>
          <Home />
        </AuthWrapper>
      </Route>
      <Route path="/chat/:chatId" component={PersonalChat} />
      <Route path="/chats" component={ChatManager} />
      <Route path="/meeting/:meetingId" component={JoinMeeting} />
      <Route path="/join/:meetingId" component={JoinSharedMeeting} />
      <Route path="/join" component={JoinByCode} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
