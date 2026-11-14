-- Convert legacy business account roles to the current shared role.
UPDATE users SET role = 'agricultural_business' WHERE role IN ('buyer','logistics','truck','storage','dryer','miller');
