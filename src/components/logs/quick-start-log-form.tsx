"use client";

import { Play } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/react";

export function QuickStartLogForm() {
  const utils = trpc.useUtils();
  const { data: categories = [] } = trpc.category.list.useQuery();
  const formRef = useRef<HTMLFormElement>(null);

  const startTimer = trpc.timeLog.startTimer.useMutation({
    onSuccess: () => {
      utils.timeLog.list.invalidate();
      formRef.current?.reset();
    },
  });

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const title = String(formData.get("title") || "") || undefined;
        const categoryId = String(formData.get("categoryId") || "") || undefined;
        startTimer.mutate({ title, categoryId });
      }}
      className="shrink-0 flex items-center gap-3 px-1 py-1"
    >
      <Input
        name="title"
        placeholder="What are you working on?"
        className="h-8 flex-1 border-none bg-transparent px-1 text-[#f1f1f1] placeholder:text-[#7f7f7f] shadow-none focus-visible:ring-0"
      />
      <select
        name="categoryId"
        aria-label="Category"
        defaultValue=""
        className="h-8 min-w-[120px] rounded-[10px] border border-[#3a3a3a] bg-[#2B2B2B] px-2 text-sm text-[#d7d7d7] outline-none"
      >
        <option value="">No category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <Button
        type="submit"
        size="icon"
        disabled={startTimer.isPending}
        className="size-10 rounded-full bg-[#D0FF00] text-[#202609] hover:bg-[#D0FF00]/90"
        aria-label="Start log"
      >
        <Play className="size-5 fill-current" />
      </Button>
    </form>
  );
}
