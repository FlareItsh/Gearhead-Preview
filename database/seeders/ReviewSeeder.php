<?php

namespace database\seeders;

use App\Models\Review;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $reviews = [
            [
                'name' => 'Maria Santos',
                'comment' => 'Grabe ka satisfied ko sa service sa Gearhead! Murag bag-o na pud akong sakyanan after every visit. Highly recommended jud!',
                'rating' => 5,
                'is_displayed' => true,
                'is_verified' => true,
            ],
            [
                'name' => 'Juan Dela Cruz',
                'comment' => 'Pinakabest na carwash dinhi sa amo! Kaayo kamaayo ug professional ang staff ug makita nila tanan detalye. Sulit kaayo!',
                'rating' => 5,
                'is_displayed' => true,
                'is_verified' => true,
            ],
            [
                'name' => 'Angela Reyes',
                'comment' => 'Ganahan kaayo ko sa ilang pag-atiman sa akong sakyanan! Ang interior cleaning kay top-notch jud. Mobalik jud ko dinhi!',
                'rating' => 5,
                'is_displayed' => true,
                'is_verified' => true,
            ],
            [
                'name' => 'Marco Villanueva',
                'comment' => 'Dili jud ko madisappoint sa Gearhead! Paspas ang service pero quality gihapon. Every weekend na lang ko nag-pahugas dinhi.',
                'rating' => 5,
                'is_displayed' => true,
                'is_verified' => true,
            ],
            [
                'name' => 'Sofia Fernandez',
                'comment' => 'Amazing kaayo ang service! Ang mga spots nga wala nako mamatikdi, nalimpyo nila tanan. Buotan pa kaayo ang staff!',
                'rating' => 5,
                'is_displayed' => true,
                'is_verified' => true,
            ],
            [
                'name' => 'Carlos Mendoza',
                'comment' => 'Grabe ang transformation sa akong hugaw nga sakyanan, murag showroom na! Excellent kaayo ang detailing work nila.',
                'rating' => 5,
                'is_displayed' => true,
                'is_verified' => true,
            ],
            [
                'name' => 'Isabel Garcia',
                'comment' => 'Ang presyo kay barato ra pero premium quality ang service! Ang team kay accommodating ug professional kaayo!',
                'rating' => 5,
                'is_displayed' => true,
                'is_verified' => true,
            ],
            [
                'name' => 'Rafael Torres',
                'comment' => 'Daghan nako natry nga carwash pero Gearhead jud ang pinakanindot! Kabalo jud kaayo sila sa ilang trabaho.',
                'rating' => 5,
                'is_displayed' => true,
                'is_verified' => true,
            ],
            [
                'name' => 'Kristina Lopez',
                'comment' => 'Limpyo kaayo ang facilities ug friendly ang staff! Wala pa jud koy nakit-an nga ing-ani ka nindot akong sakyanan. Salamat Gearhead!',
                'rating' => 5,
                'is_displayed' => true,
                'is_verified' => true,
            ],
            [
                'name' => 'Kristine Hilarious',
                'comment' => 'First time nako dinhi pero sobra kaayo ko satisfied! Paspas, limpyo, ug barato pa. Highly recommended jud ni!',
                'rating' => 5,
                'is_displayed' => true,
                'is_verified' => true,
            ],
        ];

        foreach ($reviews as $review) {
            Review::create($review);
        }
    }
}
