import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage } from "@radix-ui/react-avatar"
import { ChangeEvent, useState } from "react"
import { useStore } from "@/lib/store"


export default function EditImageDialog() {
  const { user } = useStore();
  const [previewImage, setPreviewImage] = useState("")

  async function handleChange(evt: ChangeEvent<HTMLInputElement>) {
    const file = evt.target.files?.[0]
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer()
    console.log(arrayBuffer)

    // Event based
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.addEventListener('load', (evt) => {
      console.log(evt)
      // You can now use avatarImageRef.current here if needed
      const url = evt.target?.result
      if (!url || typeof url !== 'string') {
        return
      }

      setPreviewImage(url)

    })
  }
  return (
    <div>
      <Dialog>
        <form>
          <DialogTrigger asChild>
            <Button className="px-2 py-1 text-sm text-primary" variant='link'>Edit Picture</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit profile picture</DialogTitle>
              <DialogDescription>
                Make changes to your profile picture here. Click save when you&apos;re
                done.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Input type="file" accept="image/*" onChange={handleChange} />
            </div>

            {
              previewImage && <Avatar className="h-32 w-32 relative flex justify-center items-center text-center rounded-full bg-primary">
                <AvatarImage src={previewImage} alt="Avatar" className="rounded-full" />
              </Avatar>
            }
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
    </div>
  )
}
