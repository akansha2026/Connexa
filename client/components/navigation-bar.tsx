
import {ChatList} from "./chat-list";
import { ProfileSection } from "./profile-section";
import { SearchSection } from "./search-section";

export function NavigationBar() {
  return (
    <div className="h-full p-2 gap-2 flex flex-col justify-start">
      <ProfileSection />
      <SearchSection />
      <ChatList />
    </div>
  );
}
