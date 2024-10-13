/**
 * Remove the old ids from the array and append the new sorted ids to the array.
 * This function is used to save ids order in the database.
 */
export function removeThenAppendNewSortedIdsToArray<T>(
	oldIds: T[],
	newSortedIds: T[]
): T[] {
	return [
		...oldIds.filter((id) => !newSortedIds.includes(id)),
		...newSortedIds
	];
}
