import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HeadingSmall from '@/components/heading-small';
import { Link } from '@inertiajs/react';

// Define Service type locally
interface Service {
    service_name: string;
    description: string;
    estimated_duration: number;
    price: number;
    size: string;
}

interface ServiceCardListProps {
    services: Service[];
}

export default function ServiceCardList({ services }: ServiceCardListProps) {
    return (
        <div className="flex flex-wrap justify-center gap-4">
            {services.map((s, i) => (
                <div
                    key={i}
                    className="flex w-sm flex-col justify-between gap-5 rounded-sm border p-4"
                >
                    <HeadingSmall
                        title={`${s.service_name} - ${s.size.charAt(0).toUpperCase()}`}
                        description={s.description
                            .replace(/,\s*/g, ', ')
                            .split(', ')
                            .map(
                                (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
                            )
                            .join(', ')}
                    />
                    <div className="flex justify-between gap-2">
                        <div className="flex gap-2">
                            <Clock />{' '}
                            <span>
                                {s.estimated_duration}
                                <span> mins</span>
                            </span>
                        </div>
                        <p className="font-bold">₱{s.price.toLocaleString()}</p>
                    </div>
                    <hr className="border-gray-400/50" />
                    <div className="flex flex-col">
                        <span>Car Size: {s.size}</span>
                    </div>
                    <Link className="flex w-full">
                        <Button variant="highlight" className="w-full">
                            Select
                        </Button>
                    </Link>
                </div>
            ))}
        </div>
    );
}
