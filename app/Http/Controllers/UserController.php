<?php

namespace App\Http\Controllers;

use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    private UserRepositoryInterface $users;

    public function __construct(UserRepositoryInterface $users)
    {
        $this->users = $users;
    }

    // public function index()
    // {
    //     $users = $this->users->all();

    //     return Inertia::render('Admin/Users/Index', [
    //         'users' => $users,
    //     ]);
    // }

    // public function show(int $id)
    // {
    //     $user = $this->users->findById($id);
    //     abort_if(! $user, 404);

    //     return Inertia::render('Admin/Users/Show', [
    //         'user' => $user,
    //     ]);
    // }

    /**
     * Render registry page for admin area.
     * Uses the UserRepository to fetch users and passes them to the Inertia page.
     */
    public function update(Request $request, int $id)
    {
        $user = $this->users->findById($id);
        abort_if(! $user, 404);

        $this->users->update($user, $request->all());

        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }

    public function destroy(int $id)
    {
        $user = $this->users->findById($id);
        abort_if(! $user, 404);

        $this->users->delete($user);

        return redirect()->route('users.index')->with('success', 'User deleted successfully.');
    }
}
