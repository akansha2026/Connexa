export function ChatList() {
  return <div className="border p-2 flex-1 rounded-lg">
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 rounded-full bg-gray-300"></div>
        <div className="flex flex-col">
          <span className="font-semibold">User Name</span>
          <span className="text-sm text-gray-500">Last message preview...</span>
        </div>
      </div>
    </div>
  </div>;
}
