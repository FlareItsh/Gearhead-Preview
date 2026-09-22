<?php

namespace App\Providers;

use App\Repositories\Contracts\BayRepositoryInterface;
use App\Repositories\Contracts\CarRepositoryInterface;
use App\Repositories\Contracts\EmployeeRepositoryInterface;
use App\Repositories\Contracts\LandingPageContentRepositoryInterface;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use App\Repositories\Contracts\PulloutRequestDetailRepositoryInterface;
use App\Repositories\Contracts\PulloutRequestRepositoryInterface;
use App\Repositories\Contracts\PulloutServiceRepositoryInterface;
use App\Repositories\Contracts\ServiceOrderDetailRepositoryInterface;
use App\Repositories\Contracts\ServiceOrderRepositoryInterface;
use App\Repositories\Contracts\ServiceRepositoryInterface;
use App\Repositories\Contracts\SupplierRepositoryInterface;
use App\Repositories\Contracts\SupplyPurchaseDetailRepositoryInterface;
use App\Repositories\Contracts\SupplyPurchaseRepositoryInterface;
use App\Repositories\Contracts\SupplyRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\EloquentBayRepository;
use App\Repositories\EloquentCarRepository;
use App\Repositories\EloquentEmployeeRepository;
use App\Repositories\EloquentLandingPageContentRepository;
use App\Repositories\EloquentPaymentRepository;
use App\Repositories\EloquentPulloutRequestDetailRepository;
use App\Repositories\EloquentPulloutRequestRepository;
use App\Repositories\EloquentPulloutServiceRepository;
use App\Repositories\EloquentServiceOrderDetailRepository;
use App\Repositories\EloquentServiceOrderRepository;
use App\Repositories\EloquentServiceRepository;
use App\Repositories\EloquentSupplierRepository;
use App\Repositories\EloquentSupplyPurchaseDetailRepository;
use App\Repositories\EloquentSupplyPurchaseRepository;
use App\Repositories\EloquentSupplyRepository;
use App\Repositories\EloquentUserRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
        $this->app->bind(CarRepositoryInterface::class, EloquentCarRepository::class);
        // Employee repository
        $this->app->bind(EmployeeRepositoryInterface::class, EloquentEmployeeRepository::class);

        // Bay repository
        $this->app->bind(BayRepositoryInterface::class, EloquentBayRepository::class);

        // Services / suppliers / supplies
        $this->app->bind(ServiceRepositoryInterface::class, EloquentServiceRepository::class);
        $this->app->bind(SupplierRepositoryInterface::class, EloquentSupplierRepository::class);
        $this->app->bind(SupplyRepositoryInterface::class, EloquentSupplyRepository::class);

        // Service orders and details
        $this->app->bind(ServiceOrderRepositoryInterface::class, EloquentServiceOrderRepository::class);
        $this->app->bind(ServiceOrderDetailRepositoryInterface::class, EloquentServiceOrderDetailRepository::class);

        // Payments
        $this->app->bind(PaymentRepositoryInterface::class, EloquentPaymentRepository::class);

        // Pullout requests / services / details
        $this->app->bind(PulloutRequestRepositoryInterface::class, EloquentPulloutRequestRepository::class);
        $this->app->bind(PulloutServiceRepositoryInterface::class, EloquentPulloutServiceRepository::class);
        $this->app->bind(PulloutRequestDetailRepositoryInterface::class, EloquentPulloutRequestDetailRepository::class);

        // Supply purchases / details
        $this->app->bind(SupplyPurchaseRepositoryInterface::class, EloquentSupplyPurchaseRepository::class);
        $this->app->bind(SupplyPurchaseDetailRepositoryInterface::class, EloquentSupplyPurchaseDetailRepository::class);

        // Landing page
        $this->app->bind(LandingPageContentRepositoryInterface::class, EloquentLandingPageContentRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
