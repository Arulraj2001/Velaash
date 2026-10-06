-- Migration: 20261006000033_south_indian_static_category_thumbnails.sql
-- Description: Update all active category image thumbnails to static South Indian heritage photography assets in /categories/

UPDATE categories SET image_url = '/categories/sarees.jpg' WHERE slug = 'sarees';
UPDATE categories SET image_url = '/categories/kurtas-sets.jpg' WHERE slug = 'kurtas-sets';
UPDATE categories SET image_url = '/categories/dresses.jpg' WHERE slug = 'dresses';
UPDATE categories SET image_url = '/categories/tops-shirts.jpg' WHERE slug = 'tops-shirts';
UPDATE categories SET image_url = '/categories/bottoms.jpg' WHERE slug = 'bottoms';
UPDATE categories SET image_url = '/categories/loungewear.jpg' WHERE slug = 'loungewear';
UPDATE categories SET image_url = '/categories/men.jpg' WHERE slug = 'men';
UPDATE categories SET image_url = '/categories/men-kurtas.jpg' WHERE slug = 'men-kurtas';
UPDATE categories SET image_url = '/categories/men-t-shirts.jpg' WHERE slug = 'men-t-shirts';
UPDATE categories SET image_url = '/categories/men-bottoms.jpg' WHERE slug = 'men-bottoms';
UPDATE categories SET image_url = '/categories/pooja-and-brass.jpg' WHERE slug = 'pooja-and-brass';
UPDATE categories SET image_url = '/categories/lamps-diyas.jpg' WHERE slug = 'lamps-diyas';
UPDATE categories SET image_url = '/categories/pooja-accessories.jpg' WHERE slug = 'pooja-accessories';
