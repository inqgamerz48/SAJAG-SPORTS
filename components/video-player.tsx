export function VideoPlayer({ src }: { src: string }) {
    return (
        <video
            src={src}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            controls={false}
        />
    )
}
