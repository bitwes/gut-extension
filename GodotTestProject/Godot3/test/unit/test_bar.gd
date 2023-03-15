extends GutTest

class SomeBaseTestClass:
	extends GutTest

	func foo():
		return 'bar'



class TestBarClassOne:
	extends GutTest

	func test_bar_one():
		pass_test('this passes')

	func test_bar_two():
		fail_test('this fails')

	func test_pending():
		pending('this test is pending')


class TestBarClassTwo:
	extends GutTest

	func test_bar_one():
		pass_test('this passes')

	func test_bar_two():
		fail_test('this fails')

	func test_pending():
		pending('this test is pending')


class TestUsingBaseClass:
	extends SomeBaseTestClass

	func test_one_thing():
		assert_eq('just one more thing', 'no way!')

	func test_something_else():
		assert_ne('could not think of another', 'witty thing to type')

func test_at_the_end_1():
	assert_true(true)

func test_at_the_end_2():
	assert_false(false)
