"use client"
import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface NotificationDisplayProps {
  title?: string
  body?: string
  name?: string
  pic?: string
  soundUrl?: string
}

const NotificationDisplay: React.FC<NotificationDisplayProps> = ({
  title = "Hellodsklfjs",
  body = "Hi",
  name = "",
  pic = "",
  soundUrl = "/notification.mp3", // put your sound file in /public
}) => {
  const [visible, setVisible] = React.useState(true)

  React.useEffect(() => {
    if (visible && soundUrl) {
      const audio = new Audio(soundUrl)
      audio.play().catch(() => {
        // ignore autoplay errors
      })
    }
  }, [visible, soundUrl])

  if (!visible) return null

  return (
    <div className="fixed top-5 right-5 w-80">
      <Card className="border shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <div className="flex flex-row items-center gap-3">
            <Avatar>
              <AvatarImage src={pic} alt={name} />
              <AvatarFallback>
                {name ? name[0]?.toUpperCase() : "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm">{title}</CardTitle>
              <CardDescription className="text-xs">{body}</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-500"
            onClick={() => setVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
      </Card>
    </div>
  )
}

export default NotificationDisplay
