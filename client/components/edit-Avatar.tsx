import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ChangeEvent, FormEvent} from "react"

import Image from "next/image"

type EditImageDialogProps = {
  previewImage: string;
  setPreviewImage: (newUrl: string) => void;
  handleSubmit: (evt: FormEvent<HTMLButtonElement>) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void
}

export default function EditImageDialog({
  previewImage,
  setPreviewImage,
  handleSubmit,
  isOpen,
  setIsOpen
}: Readonly<EditImageDialogProps>) {
  

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
      <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
        <form>
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
              previewImage && <div className="w-full p-2 flex justify-center border rounded-sm">
                <Image src={previewImage} alt="Preview image" width={400} height={400} />
              </div>
            }
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
                <Button type="submit" onClick={handleSubmit}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
    </div>
  )
}
