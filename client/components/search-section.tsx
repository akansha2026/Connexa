import { Search, X } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "motion/react";

export function SearchSection() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  function handleSubmit(evt: FormEvent<HTMLFormElement>) {
    evt.preventDefault();
    const query = inputRef.current?.value?.trim();
    if (query) {
      console.log("Searching for:", query);
      // TODO: Implement search functionality
    }
  }

  function clearSearch() {
    setSearchValue("");
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  }

  return (
    <motion.div 
      className="relative"
      animate={{ 
        scale: isFocused ? 1.02 : 1,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className={`
        flex items-center px-3 py-2 
        border rounded-xl shadow-sm transition-all duration-200
        ${isFocused 
          ? 'bg-background border-primary/30 shadow-md' 
          : 'bg-secondary/50 border-border/30 hover:bg-secondary/70'
        }
      `}>
        <Search className={`
          h-4 w-4 transition-colors duration-200
          ${isFocused ? 'text-primary' : 'text-muted-foreground'}
        `} />
        
        <form onSubmit={handleSubmit} className="flex-1">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search conversations..."
            autoComplete="off"
            className="w-full px-3 py-1 border-none outline-none bg-transparent text-sm placeholder:text-muted-foreground"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </form>

        <AnimatePresence>
          {searchValue && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-accent/50"
                onClick={clearSearch}
                type="button"
              >
                <X className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}