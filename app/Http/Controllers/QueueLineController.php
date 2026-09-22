<?php

namespace App\Http\Controllers;

use App\Models\QueueLine;
use App\Models\ServiceOrder;
use App\Models\ServiceVariant;
use App\Repositories\Contracts\ServiceOrderRepositoryInterface;
use Illuminate\Http\Request;

class QueueLineController extends Controller
{
    protected ServiceOrderRepositoryInterface $repo;

    public function __construct(ServiceOrderRepositoryInterface $repo)
    {
        $this->repo = $repo;
    }

    public function active()
    {
        $queues = QueueLine::with(['serviceOrder.user', 'serviceOrder.details.serviceVariant.service'])
            ->where('status', 'waiting')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($queues);
    }

    public function storeWalkIn(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|integer|exists:users,user_id',
            'variant_ids' => 'required|array|min:1',
            'variant_ids.*' => 'required|integer|exists:service_variants,service_variant',
            'idempotency_key' => 'nullable|string',
        ]);

        try {
            if ($request->has('idempotency_key')) {
                $existingOrder = ServiceOrder::where('idempotency_key', $request->input('idempotency_key'))->first();
                if ($existingOrder) {
                    $queue = QueueLine::where('service_order_id', $existingOrder->service_order_id)->first();
                    if (! $queue) {
                        $queue = QueueLine::create([
                            'service_order_id' => $existingOrder->service_order_id,
                            'status' => 'waiting',
                        ]);
                    }

                    return response()->json([
                        'message' => 'Queue already created',
                        'queue' => $queue->load('serviceOrder.user', 'serviceOrder.details.serviceVariant.service'),
                    ], 200);
                }
            }

            $orderData = [
                'user_id' => $validated['customer_id'],
                'employee_id' => null,
                'bay_id' => null,
                'status' => 'pending',
                'order_date' => now(),
                'order_type' => 'W',
                'idempotency_key' => $request->input('idempotency_key'),
            ];

            $variants = ServiceVariant::whereIn('service_variant', $validated['variant_ids'])->get()->keyBy('service_variant');

            $details = [];
            foreach ($validated['variant_ids'] as $variant_id) {
                if ($variant = $variants->get($variant_id)) {
                    $details[] = [
                        'service_variant' => $variant_id,
                        'quantity' => 1,
                    ];
                }
            }

            $order = $this->repo->createWithDetails($orderData, $details);

            $queue = QueueLine::create([
                'service_order_id' => $order->service_order_id,
                'status' => 'waiting',
            ]);

            return response()->json([
                'message' => 'Added to queue successfully',
                'queue' => $queue->load('serviceOrder.user', 'serviceOrder.details.serviceVariant.service'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to add to queue',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function storeReservation(Request $request)
    {
        $validated = $request->validate([
            'service_order_id' => 'required|integer|exists:service_orders,service_order_id',
        ]);

        try {
            $existingQueue = QueueLine::where('service_order_id', $validated['service_order_id'])->first();
            if ($existingQueue) {
                return response()->json([
                    'message' => 'Already in queue',
                    'queue' => $existingQueue->load('serviceOrder.user', 'serviceOrder.details.serviceVariant.service'),
                ], 200);
            }

            $queue = QueueLine::create([
                'service_order_id' => $validated['service_order_id'],
                'status' => 'waiting',
            ]);

            return response()->json([
                'message' => 'Added reservation to queue successfully',
                'queue' => $queue->load('serviceOrder.user', 'serviceOrder.details.serviceVariant.service'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to add reservation to queue',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
