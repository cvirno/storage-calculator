/*
  # Update Processors List

  This migration updates the processors table with the latest Intel Xeon processor models.

  1. Changes
    - Clear existing processor data
    - Insert new processor models with updated specifications
*/

-- Clear existing processor data
TRUNCATE TABLE processors;

-- Insert updated processors data
INSERT INTO processors (name, cores, frequency, generation, spec_int_base, tdp) VALUES
    ('Intel Xeon Bronze 3408U', 8, '1.8 GHz', '4th Gen', 45, 125),
    ('Intel Xeon Gold 6438Y+', 32, '2.0 GHz', '4th Gen', 85, 205),
    ('Intel Xeon Platinum 8462Y+', 32, '2.8 GHz', '4th Gen', 95, 300),
    ('Intel Xeon Gold 5411N', 24, '1.9 GHz', '4th Gen', 75, 165),
    ('Intel Xeon Gold 5412U', 24, '2.1 GHz', '4th Gen', 78, 185),
    ('Intel Xeon Gold 5415+', 8, '2.9 GHz', '4th Gen', 65, 150),
    ('Intel Xeon Gold 5416S', 16, '2.0 GHz', '4th Gen', 70, 150),
    ('Intel Xeon Gold 5418N', 24, '1.8 GHz', '4th Gen', 72, 165),
    ('Intel Xeon Gold 5418Y', 24, '2.0 GHz', '4th Gen', 75, 185),
    ('Intel Xeon Gold 5420+', 28, '2.0 GHz', '4th Gen', 80, 205),
    ('Intel Xeon Gold 5515+', 8, '3.2 GHz', '4th Gen', 68, 165),
    ('Intel Xeon Gold 5520+', 28, '2.2 GHz', '4th Gen', 82, 205),
    ('Intel Xeon Gold 6416H', 18, '2.2 GHz', '4th Gen', 72, 165),
    ('Intel Xeon Gold 6418H', 24, '2.1 GHz', '4th Gen', 76, 185),
    ('Intel Xeon Gold 6426Y', 16, '2.5 GHz', '4th Gen', 75, 185),
    ('Intel Xeon Gold 6428N', 32, '1.8 GHz', '4th Gen', 82, 185),
    ('Intel Xeon Gold 6430', 32, '2.1 GHz', '4th Gen', 85, 270),
    ('Intel Xeon Gold 6434H', 8, '3.7 GHz', '4th Gen', 70, 195),
    ('Intel Xeon Gold 6438M', 32, '2.2 GHz', '4th Gen', 86, 205),
    ('Intel Xeon Gold 6438N', 32, '2.0 GHz', '4th Gen', 84, 205),
    ('Intel Xeon Gold 6442Y', 24, '2.6 GHz', '4th Gen', 86, 225),
    ('Intel Xeon Gold 6444Y', 16, '3.6 GHz', '4th Gen', 82, 270),
    ('Intel Xeon Gold 6448Y', 32, '2.1 GHz', '4th Gen', 85, 225),
    ('Intel Xeon Gold 6454S', 32, '2.2 GHz', '4th Gen', 87, 270),
    ('Intel Xeon Gold 6458Q', 32, '3.1 GHz', '4th Gen', 92, 350),
    ('Intel Xeon Gold 6526Y', 16, '2.8 GHz', '4th Gen', 78, 195),
    ('Intel Xeon Gold 6530', 32, '2.1 GHz', '4th Gen', 85, 270),
    ('Intel Xeon Gold 6534', 8, '3.9 GHz', '4th Gen', 72, 195),
    ('Intel Xeon Gold 6538N', 32, '2.1 GHz', '4th Gen', 85, 205),
    ('Intel Xeon Gold 6538Y+', 32, '2.2 GHz', '4th Gen', 86, 225),
    ('Intel Xeon Gold 6544Y', 16, '3.6 GHz', '4th Gen', 82, 270),
    ('Intel Xeon Gold 6548N', 32, '2.8 GHz', '4th Gen', 90, 250),
    ('Intel Xeon Gold 6554S', 36, '2.2 GHz', '4th Gen', 88, 270),
    ('Intel Xeon Gold 6558Q', 32, '3.2 GHz', '4th Gen', 93, 350),
    ('Intel Xeon Platinum 8444H', 16, '2.9 GHz', '4th Gen', 85, 270),
    ('Intel Xeon Platinum 8450H', 28, '2.0 GHz', '4th Gen', 88, 250),
    ('Intel Xeon Platinum 8452Y', 36, '2.0 GHz', '4th Gen', 90, 300),
    ('Intel Xeon Platinum 8454H', 32, '2.1 GHz', '4th Gen', 89, 270),
    ('Intel Xeon Platinum 8458P', 44, '2.7 GHz', '4th Gen', 98, 350),
    ('Intel Xeon Platinum 8460H', 40, '2.2 GHz', '4th Gen', 95, 330),
    ('Intel Xeon Platinum 8460Y+', 40, '2.0 GHz', '4th Gen', 93, 300),
    ('Intel Xeon Platinum 8461V', 48, '2.2 GHz', '4th Gen', 97, 300),
    ('Intel Xeon Platinum 8468', 48, '2.1 GHz', '4th Gen', 96, 350),
    ('Intel Xeon Platinum 8468H', 48, '2.1 GHz', '4th Gen', 96, 330),
    ('Intel Xeon Platinum 8468V', 48, '2.4 GHz', '4th Gen', 98, 330),
    ('Intel Xeon Platinum 8470', 52, '2.0 GHz', '4th Gen', 97, 350),
    ('Intel Xeon Platinum 8470N', 52, '1.7 GHz', '4th Gen', 95, 300),
    ('Intel Xeon Platinum 8470Q', 52, '2.1 GHz', '4th Gen', 98, 350),
    ('Intel Xeon Platinum 8480+', 56, '2.0 GHz', '4th Gen', 98, 350),
    ('Intel Xeon Platinum 8490H', 60, '1.9 GHz', '4th Gen', 99, 350),
    ('Intel Xeon Platinum 8558', 48, '2.1 GHz', '4th Gen', 96, 330),
    ('Intel Xeon Platinum 8558P', 48, '2.7 GHz', '4th Gen', 99, 350),
    ('Intel Xeon Platinum 8558U', 48, '2.0 GHz', '4th Gen', 95, 300),
    ('Intel Xeon Platinum 8562Y+', 32, '2.8 GHz', '4th Gen', 95, 300),
    ('Intel Xeon Platinum 8568Y+', 48, '2.3 GHz', '4th Gen', 97, 350),
    ('Intel Xeon Platinum 8570', 56, '2.1 GHz', '4th Gen', 99, 350),
    ('Intel Xeon Platinum 8580', 60, '2.0 GHz', '4th Gen', 100, 350),
    ('Intel Xeon Platinum 8592+', 64, '1.9 GHz', '4th Gen', 105, 350),
    ('Intel Xeon Platinum 8592V', 64, '2.0 GHz', '4th Gen', 106, 330),
    ('Intel Xeon Platinum 8593Q', 64, '2.2 GHz', '4th Gen', 108, 385),
    ('Intel Xeon Silver 4410T', 10, '2.7 GHz', '4th Gen', 55, 150),
    ('Intel Xeon Silver 4410Y', 12, '2.0 GHz', '4th Gen', 58, 150),
    ('Intel Xeon Silver 4416+', 20, '2.0 GHz', '4th Gen', 75, 165),
    ('Intel Xeon Silver 4514Y', 16, '2.0 GHz', '4th Gen', 65, 150),
    ('Intel Xeon Silver 4516Y+', 24, '2.2 GHz', '4th Gen', 78, 185),
    ('Intel Xeon Gold 6434', 8, '3.7 GHz', '4th Gen', 70, 195),
    ('Intel Xeon Gold 6448H', 32, '2.4 GHz', '4th Gen', 89, 250),
    ('Intel Xeon Gold 6542Y', 24, '2.9 GHz', '4th Gen', 88, 250),
    ('Intel Xeon Silver 4509Y', 8, '2.6 GHz', '4th Gen', 52, 125),
    ('Intel Xeon Silver 4510', 12, '2.4 GHz', '4th Gen', 60, 150),
    ('Intel Xeon Gold 6414U', 32, '2.0 GHz', '4th Gen', 84, 250),
    ('Intel Xeon Gold 6548Y+', 32, '2.5 GHz', '4th Gen', 88, 250),
    ('Intel Xeon Silver 4510T', 12, '2.0 GHz', '4th Gen', 56, 115),
    ('Intel Xeon 5423N', 20, '2.1 GHz', '4th Gen', 72, 145),
    ('Intel Xeon 5433N', 20, '2.3 GHz', '4th Gen', 74, 160),
    ('Intel Xeon 6403N', 24, '1.9 GHz', '4th Gen', 75, 185),
    ('Intel Xeon 6423N', 28, '2.0 GHz', '4th Gen', 78, 195),
    ('Intel Xeon 6433N', 32, '2.0 GHz', '4th Gen', 82, 205),
    ('Intel Xeon 6443N', 32, '1.6 GHz', '4th Gen', 80, 195),
    ('Intel Xeon Bronze 3508U', 8, '2.1 GHz', '4th Gen', 48, 125),
    ('Intel Xeon Gold 5512U', 28, '2.1 GHz', '4th Gen', 80, 185),
    ('Intel Xeon Platinum 8571N', 52, '2.4 GHz', '4th Gen', 99, 300),
    ('Intel Xeon Platinum 8581V', 60, '2.0 GHz', '4th Gen', 100, 270);