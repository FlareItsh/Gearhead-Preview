import { FaQuoteRight, FaStar } from 'react-icons/fa';

export default function Review({ reviews = [] }: { reviews?: any[] }) {
    // If no reviews, don't show the section or show a placeholder
    if (!reviews || reviews.length === 0) return null;

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Split reviews into two groups for the two scrolling rows
    const midpoint = Math.ceil(reviews.length / 2);
    const row1 = reviews.slice(0, midpoint);
    const row2 = reviews.slice(midpoint);

    const ReviewCard = ({ review }: { review: any }) => (
        <div className="mx-auto max-w-sm min-w-[320px] flex-shrink-0 rounded-2xl border border-border p-5 shadow-lg bg-card">
            <div className="mb-4 flex items-start justify-between">
                <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                        <FaStar 
                            key={i} 
                            className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400' : 'text-muted-foreground/20'}`} 
                        />
                    ))}
                </div>
                <FaQuoteRight className="h-6 w-6 text-foreground" />
            </div>

            <p className="mb-5 text-sm leading-relaxed text-foreground min-h-[60px]">
                {review.comment}
            </p>

            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground dark:bg-highlight/20 dark:text-highlight">
                    {getInitials(review.name)}
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-foreground">
                        {review.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                        {review.is_verified ? 'Verified Customer' : 'Customer'}
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <section id="review" className="overflow-hidden bg-background py-16">
            <div className="mb-12 w-full text-center">
                <h1 className="mb-4 text-5xl font-bold tracking-tight">
                    <span className="text-foreground">What Our </span>
                    <span className="text-yellow-400 dark:text-highlight">
                        Customers Say
                    </span>
                </h1>
                <p className="mx-auto max-w-2xl text-muted-foreground">
                    Don't just take our word for it, hear from satisfied car
                    owners
                </p>
            </div>

            {/* Seamless Infinite Scroll Styles */}
            <style>{`
                .carousel-track {
                    display: flex;
                    gap: 1.25rem;
                    width: fit-content;
                }

                .carousel-track-left {
                    animation: scroll-left 60s linear infinite;
                }

                .carousel-track-right {
                    animation: scroll-right 60s linear infinite;
                }

                @keyframes scroll-left {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(-50%);
                    }
                }

                @keyframes scroll-right {
                    from {
                        transform: translateX(-50%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }

                .carousel-container:hover .carousel-track-left,
                .carousel-container:hover .carousel-track-right {
                    animation-play-state: paused;
                }
            `}</style>

            {/* Row 1 - Scrolling Left */}
            <div className="carousel-container">
                <div className="carousel-track carousel-track-left">
                    {[...row1, ...row1].map((review, index) => (
                        <ReviewCard key={`left-${index}`} review={review} />
                    ))}
                </div>
            </div>

            {/* Row 2 - Scrolling Right */}
            {row2.length > 0 && (
                <div className="carousel-container mt-10">
                    <div className="carousel-track carousel-track-right">
                        {[...row2, ...row2].map((review, index) => (
                            <ReviewCard key={`right-${index}`} review={review} />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
