<?php

namespace App\Repositories;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class EloquentUserRepository implements UserRepositoryInterface
{
    public function all(): Collection
    {
        return User::all();
    }

    public function findById(int $id): ?User
    {
        return User::find($id);
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function create(array $data): User
    {
        $data['password'] = Hash::make($data['password']);

        return User::create($data);
    }

    public function update(User $user, array $data): bool
    {
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        return $user->update($data);
    }

    public function delete(User $user): bool
    {
        return $user->delete();
    }

    public function getCustomersWithBookings()
    {
        $bookingsSubquery = DB::table('service_orders as so')
            ->join('payments as p', 'so.service_order_id', '=', 'p.service_order_id')
            ->whereColumn('so.user_id', 'u.user_id')
            ->selectRaw('COUNT(DISTINCT so.service_order_id)');

        return DB::table('users as u')
            ->where('u.role', 'customer')
            ->select(
                'u.user_id',
                'u.first_name',
                'u.middle_name',
                'u.last_name',
                'u.email',
                'u.phone_number',
                'u.address',
                'u.role',
                'u.permissions'
            )
            ->selectSub($bookingsSubquery, 'bookings')
            ->addSelect(DB::raw('(('.$bookingsSubquery->toSql().') % 9) as "loyaltyPoints"'))
            ->mergeBindings($bookingsSubquery)
            ->get();
    }

    public function getPaginatedCustomers(int $perPage, ?string $search = null, ?string $role = null)
    {
        $bookingsSubquery = DB::table('service_orders as so')
            ->join('payments as p', 'so.service_order_id', '=', 'p.service_order_id')
            ->whereColumn('so.user_id', 'u.user_id')
            ->selectRaw('COUNT(DISTINCT so.service_order_id)');

        $query = DB::table('users as u')
            ->select(
                'u.user_id',
                'u.first_name',
                'u.middle_name',
                'u.last_name',
                'u.email',
                'u.phone_number',
                'u.address',
                'u.role',
                'u.permissions'
            )
            ->selectSub($bookingsSubquery, 'bookings')
            ->addSelect(DB::raw('(('.$bookingsSubquery->toSql().') % 9) as "loyaltyPoints"'))
            ->mergeBindings($bookingsSubquery);

        if ($role) {
            $query->where('u.role', $role);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('u.first_name', 'like', "%{$search}%")
                    ->orWhere('u.last_name', 'like', "%{$search}%")
                    ->orWhere('u.email', 'like', "%{$search}%")
                    ->orWhere('u.phone_number', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('u.last_name')->paginate($perPage);
    }
}
