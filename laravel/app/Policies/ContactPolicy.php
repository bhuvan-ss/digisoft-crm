<?php

namespace App\Policies;

use App\Models\Contact;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ContactPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any contacts.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('contacts.view') || $user->is_admin;
    }

    /**
     * Determine whether the user can view the contact.
     */
    public function view(User $user, Contact $contact): bool
    {
        return $user->hasPermissionTo('contacts.view') || $user->is_admin;
    }

    /**
     * Determine whether the user can create contacts.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('contacts.create') || $user->is_admin;
    }

    /**
     * Determine whether the user can update the contact.
     */
    public function update(User $user, Contact $contact): bool
    {
        return $user->hasPermissionTo('contacts.edit') || $user->is_admin;
    }

    /**
     * Determine whether the user can delete the contact.
     */
    public function delete(User $user, Contact $contact): bool
    {
        return $user->hasPermissionTo('contacts.delete') || $user->is_admin;
    }

    /**
     * Determine whether the user can merge contacts.
     */
    public function merge(User $user): bool
    {
        return $user->hasPermissionTo('contacts.merge') || $user->is_admin;
    }
}
