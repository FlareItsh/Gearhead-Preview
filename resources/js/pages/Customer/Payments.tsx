import Heading from '@/components/heading';
import Pagination from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    Download, 
    Wallet, 
    History, 
    CreditCard, 
    TrendingUp,
    Receipt
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payment History',
        href: '/payments/user',
    },
];

interface PaginatedLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Payment {
    payment_id: number;
    date: string;
    services: string;
    amount: string | number;
    payment_method: string;
    gcash_reference: string | null;
    created_at: string;
}

interface PaymentResponse {
    paginated: {
        data: Payment[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: PaginatedLink[];
    };
    summary: {
        total_spent: number;
        total_count: number;
    };
}

export default function Payments() {
    const { props } = usePage();
    const [data, setData] = useState<PaymentResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

    const fetchPayments = async (page: number, limit: number) => {
        setIsLoading(true);
        try {
            const res = await axios.get(route('payments.user'), {
                params: { page, per_page: limit }
            });
            setData(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load payment history');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments(currentPage, perPage);
    }, [currentPage, perPage]);

    const handlePageChange = (url: string) => {
        if (!url) return;
        const page = new URL(url).searchParams.get('page');
        if (page) setCurrentPage(parseInt(page));
    };

    const handlePerPageChange = (val: string) => {
        setPerPage(parseInt(val));
        setCurrentPage(1);
    };

    // =============== PDF EXPORT FUNCTION ===============
    const downloadPDF = async () => {
        setIsExporting(true);
        toast.info('Preparing your payment report...');
        
        try {
            const res = await axios.get(route('payments.user'), {
                params: { export: 'true' }
            });
            const allPayments: Payment[] = res.data;

            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();

            // 1. Company Header
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text('GEARHEAD CARWASH', pageWidth / 2, 20, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Customer Payment History Report', pageWidth / 2, 26, { align: 'center' });

            // Horizontal Line
            doc.setDrawColor(245, 158, 11);
            doc.setLineWidth(1);
            doc.line(15, 30, pageWidth - 15, 30);

            // 2. Report Information
            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50);
            doc.setFont('helvetica', 'bold');
            doc.text('ACCOUNT SUMMARY', 15, 40);

            doc.setFont('helvetica', 'normal');
            doc.text(`Customer Name:`, 15, 46);
            doc.setFont('helvetica', 'bold');
            const user = (props.auth as any)?.user;
            const fullName = user ? `${user.first_name} ${user.last_name}` : 'Valued Customer';
            doc.text(fullName, 45, 46);

            doc.setFont('helvetica', 'normal');
            doc.text(`Report Date:`, 15, 52);
            doc.setFont('helvetica', 'bold');
            doc.text(new Date().toLocaleDateString('en-PH', { dateStyle: 'long' }), 45, 52);

            // Right Side
            const rightSideX = pageWidth - 65;
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total Records:`, rightSideX, 46);
            doc.text(`${allPayments.length} Transactions`, rightSideX + 30, 46);

            const formatAmount = (amount: string | number) => {
                const num = parseFloat(amount.toString());
                return `PHP ${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            };

            const tableData = allPayments.map((payment) => [
                new Date(payment.created_at).toLocaleDateString('en-PH', { month: 'short', day: '2-digit', year: 'numeric' }),
                payment.services || 'N/A',
                formatAmount(payment.amount),
                payment.payment_method.toUpperCase(),
                payment.gcash_reference || '-'
            ]);

            autoTable(doc, {
                head: [['DATE', 'SERVICES RENDERED', 'AMOUNT', 'METHOD', 'REFERENCE']],
                body: tableData,
                startY: 62,
                theme: 'grid',
                headStyles: {
                    fillColor: [30, 30, 30],
                    textColor: [255, 255, 255],
                    fontSize: 9,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                styles: { fontSize: 8, cellPadding: 3 },
                columnStyles: {
                    0: { cellWidth: 30, halign: 'center' },
                    1: { cellWidth: 70 },
                    2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
                    3: { cellWidth: 25, halign: 'center' },
                    4: { cellWidth: 25, halign: 'center' },
                },
                alternateRowStyles: { fillColor: [250, 250, 250] },
                margin: { left: 15, right: 15 },
            });

            const finalY = (doc as any).lastAutoTable.finalY + 10;
            const total = allPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

            doc.setFillColor(255, 248, 230); // Very Light Yellow
            doc.rect(130, finalY, 65, 12, 'F');
            doc.setFontSize(10);
            doc.setTextColor(30, 30, 30);
            doc.setFont('helvetica', 'bold');
            doc.text('TOTAL SPENT:', 135, finalY + 8);
            doc.setTextColor(245, 158, 11);
            doc.text(formatAmount(total), pageWidth - 18, finalY + 8, { align: 'right' });

            // Signature
            const sigY = finalY + 35;
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text('Prepared by Gearhead System', 15, sigY);
            doc.text(`Printed: ${new Date().toLocaleString()}`, pageWidth - 15, sigY, { align: 'right' });

            doc.save(`gearhead-payment-history-${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('Report downloaded successfully!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to generate PDF report');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payment History" />
            
            <div className="flex h-full flex-1 flex-col gap-8 rounded-xl p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <Heading
                        title="Payment History"
                        description="View and manage your transaction history with Gearhead."
                    />
                    <Button 
                        onClick={downloadPDF} 
                        variant="highlight" 
                        disabled={isExporting || !data}
                        className="h-12 rounded-2xl px-6 font-black uppercase tracking-widest shadow-lg shadow-highlight/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Download className="mr-2 h-5 w-5" />
                        {isExporting ? 'Generating...' : 'Export Report'}
                    </Button>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="group relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-card">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-highlight/5 transition-transform group-hover:scale-150" />
                        <div className="relative z-10">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-highlight/10 text-highlight">
                                <Wallet className="h-7 w-7" />
                            </div>
                            <p className="text-xs font-black tracking-widest text-muted-foreground/60 uppercase">Total Spent</p>
                            <h3 className="mt-1 text-4xl font-black text-foreground">
                                ₱{data?.summary.total_spent.toLocaleString() || '0'}
                            </h3>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-card">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/5 transition-transform group-hover:scale-150" />
                        <div className="relative z-10">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                                <Receipt className="h-7 w-7" />
                            </div>
                            <p className="text-xs font-black tracking-widest text-muted-foreground/60 uppercase">Transactions</p>
                            <h3 className="mt-1 text-4xl font-black text-foreground">
                                {data?.summary.total_count || '0'}
                            </h3>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-card">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/5 transition-transform group-hover:scale-150" />
                        <div className="relative z-10">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                                <TrendingUp className="h-7 w-7" />
                            </div>
                            <p className="text-xs font-black tracking-widest text-muted-foreground/60 uppercase">Last Activity</p>
                            <h3 className="mt-1 text-2xl font-black text-foreground">
                                {data?.paginated.data[0] 
                                    ? new Date(data.paginated.data[0].created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                                    : 'No data'}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Main Table Content */}
                <div className="flex flex-1 flex-col overflow-hidden rounded-[2.5rem] border border-border/40 bg-white shadow-2xl dark:bg-card/50">
                    <div className="custom-scrollbar flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                        <Table className="min-w-full">
                            <TableHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur-md dark:bg-card/90">
                                <TableRow className="border-b border-border/40 hover:bg-transparent">
                                    <TableHead className="py-6 text-xs font-black tracking-widest text-muted-foreground uppercase">Date</TableHead>
                                    <TableHead className="py-6 text-xs font-black tracking-widest text-muted-foreground uppercase">Services Rendered</TableHead>
                                    <TableHead className="py-6 text-right text-xs font-black tracking-widest text-muted-foreground uppercase">Amount</TableHead>
                                    <TableHead className="py-6 text-center text-xs font-black tracking-widest text-muted-foreground uppercase">Method</TableHead>
                                    <TableHead className="py-6 text-right text-xs font-black tracking-widest text-muted-foreground uppercase">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i} className="animate-pulse">
                                            <TableCell colSpan={5} className="py-8">
                                                <div className="h-4 w-full rounded bg-muted/20" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : !data || data.paginated.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                                <History className="h-16 w-16 opacity-10" />
                                                <p className="text-lg font-bold">No payment history available.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.paginated.data.map((payment, index) => (
                                        <TableRow 
                                            key={payment.payment_id}
                                            className="group border-b border-border/10 transition-colors hover:bg-muted/30"
                                        >
                                            <TableCell className="py-7">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-foreground">
                                                        {new Date(payment.created_at).toLocaleDateString('en-PH', { month: 'short', day: '2-digit', year: 'numeric' })}
                                                    </span>
                                                    <span className="mt-0.5 text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase">
                                                        {new Date(payment.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-7">
                                                <div className="flex flex-wrap gap-2">
                                                    {payment.services?.split(',').map((s, i) => (
                                                        <span key={i} className="rounded-lg border border-border/40 bg-secondary/30 px-3 py-1 text-[11px] font-bold text-foreground transition-all group-hover:bg-secondary">
                                                            {s.trim()}
                                                        </span>
                                                    )) || <span className="text-muted-foreground italic text-xs">No services listed</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-7 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-lg font-black text-foreground">
                                                        ₱{parseFloat(payment.amount as string).toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                                                        <TrendingUp className="h-3 w-3" /> Successful
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-7 text-center">
                                                <div className={`mx-auto inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                                    payment.payment_method === 'gcash' 
                                                        ? 'bg-blue-500/10 text-blue-500' 
                                                        : 'bg-emerald-500/10 text-emerald-500'
                                                }`}>
                                                    <CreditCard className="h-3.5 w-3.5" />
                                                    {payment.payment_method}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-7 text-right">
                                                {payment.gcash_reference ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Reference</span>
                                                        <span className="text-xs font-mono font-bold text-foreground group-hover:text-primary transition-colors">{payment.gcash_reference}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-muted-foreground/40 uppercase italic px-3 py-1.5 rounded-xl bg-muted/20">N/A</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Bar */}
                    {data && data.paginated.data.length > 0 && (
                        <div className="flex flex-col items-center justify-between gap-6 px-10 py-8 md:flex-row border-t border-border/20 bg-muted/10 dark:bg-muted/5">
                            <div className="flex items-center gap-5">
                                <span className="text-xs font-black tracking-widest text-muted-foreground/60 uppercase">Rows per page</span>
                                <Select
                                    value={perPage.toString()}
                                    onValueChange={handlePerPageChange}
                                >
                                    <SelectTrigger className="h-10 w-[80px] rounded-xl border-border/40 bg-white font-black dark:bg-card">
                                        <SelectValue placeholder={perPage} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border/40 bg-white font-bold dark:bg-card">
                                        {[5, 10, 20, 50].map((size) => (
                                            <SelectItem key={size} value={size.toString()} className="rounded-lg transition-colors hover:bg-secondary cursor-pointer text-foreground">
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <span className="text-xs font-bold text-muted-foreground/40">
                                    Displaying {data.paginated.data.length} of {data.paginated.total} records
                                </span>
                            </div>

                            <Pagination
                                links={data.paginated.links}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
