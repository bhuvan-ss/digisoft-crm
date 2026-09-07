<?php

use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\ImportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| DIGISOFT CRM - API Routes (Laravel 12)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Companies
    Route::apiResource('companies', CompanyController::class);

    // Contacts
    Route::apiResource('contacts', ContactController::class);
    Route::post('contacts/check-duplicate', [ContactController::class, 'checkDuplicate']);
    Route::post('contacts/merge', [ContactController::class, 'merge']);

    // Phase 2: Imports Engine
    Route::prefix('imports')->group(function () {
        Route::get('/', [ImportController::class, 'index']);
        Route::post('/upload', [ImportController::class, 'upload']);
        Route::get('/{id}/detect-mappings', [ImportController::class, 'detectMappings']);
        Route::post('/{id}/save-mappings', [ImportController::class, 'saveMappings']);
        Route::get('/{id}/preview', [ImportController::class, 'preview']);
        Route::post('/{id}/start', [ImportController::class, 'start']);
        Route::get('/{id}/progress', [ImportController::class, 'progress']);
        Route::get('/{id}/summary', [ImportController::class, 'summary']);
        Route::get('/{id}/errors', [ImportController::class, 'errors']);
        Route::post('/{id}/cancel', [ImportController::class, 'cancel']);
    });
});
