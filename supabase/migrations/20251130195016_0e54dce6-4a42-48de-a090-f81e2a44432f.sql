-- Remove duplicate units and keep only the ones with the new codes
DELETE FROM units WHERE code IN ('JUA', 'BON', 'PET', 'RIB', 'PAF', 'ALA', 'SER');

-- Update the remaining units with correct CNPJs
UPDATE units SET code = '04690106000115' WHERE name = 'Revalle Juazeiro' AND code = 'RVL-JUA';
UPDATE units SET code = '04690106000387' WHERE name = 'Revalle Bonfim' AND code = 'RVL-BON';
UPDATE units SET code = '07717961000160' WHERE name = 'Revalle Petrolina' AND code = 'RVL-PET';
UPDATE units SET code = '28098474000137' WHERE name = 'Revalle Ribeira do Pombal' AND code = 'RVL-RIB';
UPDATE units SET code = '28098474000218' WHERE name = 'Revalle Paulo Afonso' AND code = 'RVL-PAU';
UPDATE units SET code = '54677520000162' WHERE name = 'Revalle Alagoinhas' AND code = 'RVL-ALA';
UPDATE units SET code = '54677520000243' WHERE name = 'Revalle Serrinha' AND code = 'RVL-SER';