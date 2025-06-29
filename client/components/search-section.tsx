import { Search } from "lucide-react";
import { FormEvent, useRef } from "react";

export function SearchSection() {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSumit(evt: FormEvent<HTMLFormElement>) {
    evt.preventDefault();
    console.log(inputRef.current?.value);
  }

  return (
    <div className="flex items-center px-2 border shadow-sm rounded-lg bg-secondary">
      <Search className="text-muted-foreground" />
      <form onSubmit={handleSumit}>
        <input
          type="text"
          placeholder="Search"
          autoComplete="off"
          className="w-full p-2 border-none outline-none bg-transparent"
          ref={inputRef}
        />
      </form>
    </div>
  );
}
