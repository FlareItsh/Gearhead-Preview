import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Upload, QrCode } from 'lucide-react';
import { useState } from 'react';

interface GcashSettings {
    account_name: string;
    account_number: string;
    qr_code_path: string | null;
    qr_code_url: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'GCash settings',
        href: '/settings/gcash',
    },
];

export default function Gcash({ settings }: { settings: GcashSettings }) {
    const [preview, setPreview] = useState<string | null>(settings?.qr_code_url || null);
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        account_name: settings.account_name,
        account_number: settings.account_number,
        qr_code: null as File | null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('qr_code', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/settings/gcash', {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Shop GCash settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Shop GCash Information"
                        description="Update the GCash account details displayed to customers at checkout"
                    />

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="account_name">GCash Account Name</Label>
                            <Input
                                id="account_name"
                                className="mt-1 block w-full"
                                value={data.account_name}
                                onChange={(e) => setData('account_name', e.target.value)}
                                required
                                placeholder="e.g. JUAN DELA CRUZ"
                            />
                            <InputError message={errors.account_name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="account_number">GCash Phone Number</Label>
                            <Input
                                id="account_number"
                                className="mt-1 block w-full"
                                value={data.account_number}
                                onChange={(e) => setData('account_number', e.target.value)}
                                required
                                placeholder="e.g. 09123456789"
                            />
                            <InputError message={errors.account_number} />
                        </div>

                        <div className="grid gap-2">
                            <Label>QR Code Image</Label>
                            <div className="mt-2 flex items-start gap-6">
                                <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
                                    {preview ? (
                                        <img src={preview} alt="QR Code" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <QrCode className="h-8 w-8" />
                                            <span className="text-xs">No QR Code</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <Label
                                        htmlFor="qr_code"
                                        className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                                    >
                                        <Upload className="h-4 w-4" />
                                        {preview ? 'Change QR Image' : 'Upload QR Image'}
                                        <input
                                            id="qr_code"
                                            type="file"
                                            className="hidden"
                                            onChange={handleFileChange}
                                            accept="image/*"
                                        />
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        JPG, PNG or GIF. Max size 2MB.
                                    </p>
                                    <InputError message={errors.qr_code} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={processing} variant="highlight">
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                Save Settings
                            </Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">Saved successfully!</p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
