import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { Car, Check, Droplets, Sparkles, Zap } from 'lucide-react';

export default function LP_Services() {
    return (
        <section id="services">
            {/* Header */}
            <div className="w-full py-10 text-center">
                <h1 className="mb-4 text-5xl font-bold tracking-tight">
                    <span className="text-foreground">Our </span>
                    <span className="text-yellow-500 dark:text-highlight">
                        Services
                    </span>
                </h1>
                <p className="mx-auto max-w-2xl text-muted-foreground">
                    Professional car wash packages tailored to your vehicle's
                    needs
                </p>
            </div>

            <div className="w-full text-center">
                <h3 className="mb-4 text-3xl font-semibold tracking-tight">
                    <span className="text-yellow-500 dark:text-highlight">
                        Essential{' '}
                    </span>
                    Services
                </h3>
            </div>

            {/* Cards */}
            <div className="w-full">
                <div className="flex flex-wrap justify-center gap-6 px-4 md:gap-8">
                    {[
                        {
                            title: 'Basic',
                            subtitle: 'Essential wash package',
                            icon: Droplets,
                            prices: [
                                { size: 'S', price: '₱130' },
                                { size: 'M', price: '₱150' },
                                { size: 'L', price: '₱200' },
                                { size: 'XL', price: '₱200' },
                                { size: 'XXL', price: '₱350' },
                            ],
                            features: [
                                'Body Wash',
                                'Vacuum',
                                'Tire Black',
                                'Blow Dry',
                            ],
                            popular: true,
                        },
                        {
                            title: 'Underwash',
                            subtitle: 'Complete undercarriage cleaning',
                            icon: Car,
                            prices: [
                                { size: 'S', price: '₱310' },
                                { size: 'M', price: '₱340' },
                                { size: 'L', price: '₱390' },
                                { size: 'XL', price: '₱500' },
                            ],
                            features: [
                                'Body Wash',
                                'Vacuum',
                                'Tire Black',
                                'Shiny Dry',
                                'Under Wash',
                            ],
                            popular: false,
                        },
                        {
                            title: 'Engine Wash',
                            subtitle: 'Engine Degreaser + Protection',
                            icon: Zap,
                            prices: [
                                { size: 'S', price: '₱280' },
                                { size: 'M', price: '₱330' },
                                { size: 'L', price: '₱350' },
                                { size: 'XL', price: '₱480' },
                                { size: 'XXL', price: '₱520' },
                            ],
                            features: [
                                'Body Wash',
                                'Vacuum',
                                'Tire Black',
                                'Blow Dry',
                                'Engine Wash',
                            ],
                            popular: false,
                        },
                        {
                            title: 'Hand Wax',
                            subtitle: 'Premium protection & shine',
                            icon: Sparkles,
                            prices: [
                                { size: 'S', price: '₱170' },
                                { size: 'M', price: '₱200' },
                                { size: 'L', price: '₱260' },
                                { size: 'XL', price: '₱350' },
                            ],
                            features: [
                                'Body Wash',
                                'Vacuum',
                                'Tire Black',
                                'Shiny Dry',
                                'Hand Wax',
                            ],
                            popular: false,
                        },
                    ].map((card, index) => {
                        const Icon = card.icon || Check;

                        return (
                            <div key={index} className="w-full max-w-xs">
                                <div className="hover:shadow-3xl flex h-full flex-col overflow-hidden rounded-3xl border border-transparent shadow-2xl backdrop-blur-xl transition-all hover:-translate-y-3 dark:border-highlight/30">
                                    {/* Most Popular Badge - Yellow in light, amber in dark */}
                                    {card.popular && (
                                        <div className="bg-yellow-400 p-3 text-center text-sm font-bold text-black dark:bg-highlight">
                                            Most Popular
                                        </div>
                                    )}

                                    {/* Header */}
                                    <div className="px-5 pt-5 pb-3">
                                        <div className="flex flex-col items-start gap-2.5">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 shadow-sm dark:bg-highlight/10">
                                                <Icon
                                                    className="h-6 w-6 text-yellow-500 dark:text-highlight"
                                                    strokeWidth={2.5}
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-foreground">
                                                    {card.title}
                                                </h3>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {card.subtitle}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing */}
                                    <div className="px-5 pb-3">
                                        <div className="flex flex-wrap justify-center gap-2.5">
                                            {card.prices.map((item) => (
                                                <div
                                                    key={item.size}
                                                    className="flex min-w-[75px] flex-col items-center justify-center rounded-lg border border-border/40 bg-muted/5 px-3 py-2.5 shadow-sm backdrop-blur-sm transition-all hover:border-yellow-500/50 hover:bg-yellow-500/5 dark:hover:border-highlight/50 dark:hover:bg-highlight/5"
                                                >
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        {item.size}
                                                    </span>
                                                    <p className="mt-1 text-base font-bold text-yellow-500 dark:text-highlight">
                                                        {item.price}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="flex-1 border-t border-border/30 px-6 py-6">
                                        <div className="space-y-4">
                                            {card.features.map((feature) => (
                                                <div
                                                    key={feature}
                                                    className="flex items-center gap-2.5"
                                                >
                                                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 border-yellow-500 bg-yellow-500/10 dark:border-highlight dark:bg-highlight/10">
                                                        <Check
                                                            className="h-3 w-3 text-yellow-500 dark:text-highlight"
                                                            strokeWidth={3}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-foreground">
                                                        {feature}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Button */}
                                    <div className="px-6 pt-4 pb-8">
                                        <Link
                                            href={`/services?service=${encodeURIComponent(card.title === 'Engine Wash' ? 'Enginewash' : card.title)}`}
                                            className="block"
                                        >
                                            <Button
                                                variant={
                                                    card.popular
                                                        ? 'highlight'
                                                        : 'outline'
                                                }
                                                className={
                                                    card.popular
                                                        ? 'w-full rounded-2xl bg-yellow-400 py-6 font-bold shadow-lg hover:bg-yellow-500 dark:bg-highlight dark:hover:bg-highlight/90'
                                                        : 'w-full rounded-2xl border-yellow-400 py-6 font-bold text-yellow-400 shadow-lg hover:bg-yellow-400/10 dark:border-highlight dark:text-highlight dark:hover:bg-highlight/10'
                                                }
                                            >
                                                Book Now
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* VIEW ALL SERVICES */}
            <div className="flex w-full justify-center py-12">
                <Link href="/services" className="block w-full max-w-xs">
                    <Button
                        variant="highlight"
                        className="w-full rounded-2xl bg-yellow-400 py-6 text-base font-bold shadow-lg hover:bg-yellow-500 dark:bg-highlight dark:hover:bg-highlight/90"
                    >
                        View All Services
                    </Button>
                </Link>
            </div>
        </section>
    );
}
